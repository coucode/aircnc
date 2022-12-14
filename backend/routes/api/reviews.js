const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Spot, User, Review, Image, sequelize } = require('../../db/models')
const { check } = require('express-validator')
const { handleValidationErrors } = require('../../utils/validation');
const router = express.Router();

const reviewNotFound = {
  "message": "Review couldn't be found",
  "statusCode": 404
}
const forbidden = {
  "message": "Forbidden",
  "statusCode": 403
}

// Get all reviews of the current user
router.get('/current', requireAuth, async (req, res) => {
  const reviews = await Review.findAll({
    where: {
      userId: req.user.id
    },
    include: [{
      model: User,
      attributes: ['id', 'firstName', 'lastName']
    }, {
      model: Spot,
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    }]
  })
  for (let review of reviews) {
    let imgResult = []
    const images = await Image.findAll({
      where: {
        reviewId: review.id
      }
    })
    for (let image of images) {
      let temp = {}
      temp.id = image.id
      if (image.reviewId) { temp.imageableId = image.reviewId } else { temp.imageableId = image.spotId }
      temp.url = image.url
      imgResult.push(temp)
    }
    review.dataValues["Images"] = imgResult
  }
  return res.json(reviews)
})

// Add images to a review
router.post('/:reviewId/images', requireAuth, async (req, res) => {
  let review = await Review.findByPk(req.params.reviewId)
  if (!review) {
    res.status(404)
    return res.json(reviewNotFound)
  }
  if (req.user.id !== review.userId) {
    res.status(403)
    return res.json(forbidden)
  }
  let imageCheck = await Image.findAll({ where: { spotId: review.spotId } })
  if (imageCheck.length === 10) {
    res.status(403)
    return res.json({
      "message": "Maximum number of images for this resource was reached",
      "statusCode": 403
    })
  }
  const { url, previewImage } = req.body
  let newImage = await Image.create({
    url,
    previewImage,
    userId: req.user.id,
    spotId: review.spotId,
    reviewId: req.params.reviewId
  })
  return res.json({
    "id": newImage.id,
    "imageableId": review.id,
    "url": newImage.url
  })
})

// Middleware to check that review fields are valid
const validateReview = [
  check('review')
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check('stars')
    .isNumeric()
    .withMessage("Stars must be an integer from 1 to 5")
    .custom((value) => {
      if (value > 5 || value < 1) {
        throw new Error("Stars must be an integer from 1 to 5")
      }
      return true
    })
    .withMessage("Stars must be an integer from 1 to 5"),
  handleValidationErrors
]
// Edit a review
router.put('/:reviewId', requireAuth, validateReview, async (req, res) => {
  let review = await Review.findByPk(req.params.reviewId)
  if (!review) {
    res.status(404)
    return res.json(reviewNotFound)
  }
  if (req.user.id !== review.userId) {
    res.status(403)
    return res.json(forbidden)
  }
  review.update({
    "review": req.body.review,
    "stars": req.body.stars
  })
  return res.json(review)
})

// Deletes a review
router.delete('/:reviewId', requireAuth, async (req, res) => {
  let review = await Review.findByPk(req.params.reviewId)
  if (!review) {
    res.status(404)
    return res.json(reviewNotFound)
  }
  if (review.userId !== req.user.id) {
    res.status(403)
    return res.json(forbidden)
  }
  review.destroy()
  return res.json({
    "message": "Successfully deleted",
    "statusCode": 200
  })
})

module.exports = router;