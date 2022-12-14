const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Spot, Image, Booking } = require('../../db/models')

const router = express.Router();

const bookingNotFound = {
  "message": "Booking couldn't be found",
  "statusCode": 404
}
const forbidden = {
  "message": "Forbidden",
  "statusCode": 403
}

// Get all of the current user's bookings
router.get('/current', requireAuth, async (req, res) => {
  let bookings = await Booking.findAll({
    where: {
      userId: req.user.id
    }
  })

  let result = []
  for (let booking of bookings) {
    let spotInfo = await Spot.findByPk(booking.spotId, {
      attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price'],
      raw: true
    })
    let image = await Image.findOne({
      where: {
        spotId: booking.spotId,
        previewImage: true
      }, raw: true
    })
    spotInfo["previewImage"] = image.url
    let temp = {
      id: booking.id,
      spotId: booking.spotId,
      Spot: spotInfo,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }
    result.push(temp)
  }

  return res.json({
    "Bookings": result
  })
})

router.put('/:bookingId', requireAuth, async (req, res) => {
  let booking = await Booking.findByPk(req.params.bookingId)
  if (!booking) {
    res.status(404)
    return res.json(bookingNotFound)
  }
  if (booking.userId !== req.user.id) {
    res.status(403)
    return res.json(forbidden)
  }
  let currentDate = new Date()
  if (currentDate > booking.endDate) {
    res.status(403)
    return res.json({
      "message": "Past bookings can't be modified",
      "statusCode": 403,
    })
  }

  let { startDate, endDate } = req.body
  startDate = new Date(startDate)
  endDate = new Date(endDate)

  if (endDate <= startDate) {
    res.status(400)
    return res.json({
      "message": "Validation error",
      "statusCode": 400,
      "errors": {
        "endDate": "The end date cannot be on or before the start date"
      }
    })
  }
  const { Op } = require('sequelize')
  let conflicts = await Booking.findAll({
    where: {
      [Op.or]: {
        startDate: {
          [Op.between]: [startDate, endDate]
        }, endDate: {
          [Op.between]: [startDate, endDate]
        },
      },
      spotId: booking.spotId,
    },
    attributes: ['startDate', 'endDate']
  })
  let error = {}
  for (let conflict of conflicts) {
    if (startDate >= conflict.startDate && startDate <= conflict.endDate) {
      error.startDate = "Start date conflicts with an existing booking"
    }
    if (endDate >= conflict.endDate && endDate <= conflict.endDate) {
      error.endDate = "End date conflicts with an existing booking"
    }
  }
  if (error.startDate || error.endDate) {
    res.status(403)
    return res.json({
      "message": "Sorry, this spot is already booked for the specified dates",
      "statusCode": 403,
      "errors": error
    })
  }
  booking.update({
    startDate,
    endDate
  })
  return res.json(booking)
})

router.delete('/:bookingId', requireAuth, async (req, res) => {
  let booking = await Booking.findByPk(req.params.bookingId)
  if (!booking) {
    res.status(404)
    return res.json(bookingNotFound)
  }

  let { startDate, endDate } = booking
  let currentDate = new Date()
  if (currentDate >= startDate && currentDate <= endDate) {
    res.status(403)
    return res.json({
      "message": "Bookings that have been started can't be deleted",
      "statusCode": 403
    })
  }
  let spot = await Spot.findByPk(booking.spotId)
  if (booking.userId === req.user.id || spot.ownerId === req.user.id) {
    booking.destroy()
    return res.json({
      "message": "Successfully deleted",
      "statusCode": 200
    })
  } else {
    res.status(403)
    return res.json(forbidden)
  }
})
module.exports = router;