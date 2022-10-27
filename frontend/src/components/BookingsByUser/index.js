import { useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getUserBookings } from '../../store/bookings';


function BookingsByUser(){
  const dispatch = useDispatch()
  const sessionUser = useSelector(state => state.session.user);

  useEffect(() => {
    if (sessionUser){
      dispatch(getUserBookings())
    }
  }, [dispatch, sessionUser])
  const bookingsObj = useSelector(state => state.bookings)
  let bookings;
  let loading = true;

  if (bookingsObj){
    bookings = Object.values(bookingsObj)
    loading = false;
  }
  console.log(bookings)

  return (
    <div>
      {(loading === false) && (bookings.length > 0) ? (
        <>
        {bookings.map(booking => {
          return (
            <div key = {booking.id}>
              {booking.Spot.name}
              <br/>
              {booking.startDate}
              <br />
              {booking.endDate}
            </div>
          )
        })}
        </>

      ): (
          <div>
          </div>
      )}
    </div>
  )
}

export default BookingsByUser;