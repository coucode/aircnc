const express = require('express');

const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

// Middleware to check for credential fields are not empty
const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .withMessage('Email or username is required'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required'),
  handleValidationErrors
];

// Logs the user in 
router.post('/', validateLogin, async (req, res, next) => {
  const { credential, password } = req.body;
  const user = await User.login({ credential, password });

  // If the user does not exist, return an error
  if (!user) {
    const err = new Error('Login failed');
    err.status = 401;
    err.title = 'Login failed';
    err.errors = ['The provided credentials were invalid'];
    return next(err)
  }

  const token = await setTokenCookie(res, user);
  const userInfo = user //.toSafeObject()
  userInfo.token = token

  return res.json(userInfo);
})

// Retrieves information about the user that is currently logged in
router.get('/', restoreUser, (req, res) => {
  const { user } = req;
  if (user) {
    return res.json(
      user.toSafeObject()
    );
  } else return res.json(null);
}
);

// Logs out the current user
router.delete('/', (_req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'success' });
})

module.exports = router;