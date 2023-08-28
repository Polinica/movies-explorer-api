/* GET /users/:userId - возвращает пользователя по _id
   GET /users — возвращает всех пользователей
   POST /users — создаёт пользователя
   PATCH /users/me — обновляет профиль
   PATCH /users/me/avatar — обновляет аватар профиля
*/

const bcrypt = require('bcryptjs')

const {
  User,
} = require('../models/user')
const {
  NotFoundError, ConflictError, ValidationError,
} = require('../errors')

// GET /users/me - возвращает информацию о текущем пользователе

async function getUserInfo(req, res, next) {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)

    if (!user) {
      throw new NotFoundError('Пользователь не найден')
    }

    res.send(user)
  } catch (err) {
    next(err)
  }
}

// PATCH /users/me — обновляет профиль

async function updateUserInfo(req, res, next) {
  try {
    const userId = req.user._id
    const {
      email, name,
    } = req.body
    const user = await User.findByIdAndUpdate(
      userId,
      {
        email, name,
      },
      {
        new: true, runValidators: true,
      },
    )

    if (!user) {
      throw new NotFoundError('Пользователь не найден')
    }

    res.send(user)
  } catch (err) {
    next(err)
  }
}

const SALT_LENGTH = 10

// POST /users — создаёт пользователя
async function createUser(req, res, next) {
  try {
    const {
      email, password, name,
    } = req.body
    const passwordHash = await bcrypt.hash(password, SALT_LENGTH)

    let user = await User.create({
      email,
      password: passwordHash,
      name,
    })

    user = user.toObject()
    delete user.password
    res.status(201).send(user)
  } catch (err) {
    if (err.name === 'CastError' || err.name === 'ValidationError') {
      next(new ValidationError(`Неверные данные в ${err.path ?? 'запросе'}`))
      return
    }
    if (err.code === 11000) {
      next(new ConflictError('Пользователь с таким email уже существует'))
      return
    }

    next(err)
  }
}

module.exports = {
  getUserInfo, updateUserInfo, createUser,
}
