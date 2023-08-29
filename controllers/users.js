/* GET /users/:userId - возвращает пользователя по _id
   GET /users — возвращает всех пользователей
   POST /users — создаёт пользователя
   PATCH /users/me — обновляет профиль
   PATCH /users/me/avatar — обновляет аватар профиля
*/

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const {
  NODE_ENV, JWT_SECRET,
} = process.env

const {
  User,
} = require('../models/user')
const {
  NotFoundError, ConflictError, UnauthorizedError,
} = require('../errors')

const {
  handleMongooseError,
} = require('../utils/handleMongooseError')

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
    if (err.name === 'MongoServerError' && err.code === 11000) {
      next(new ConflictError('Пользователь с таким email уже существует'))
      return
    }

    if (err instanceof mongoose.Error) {
      next(handleMongooseError(err))
      return
    }
    next(err)
  }
}

const {
  SALT_LENGTH = 10,
} = process.env

// POST /users — создаёт пользователя
async function createUser(req, res, next) {
  try {
    const {
      email, password, name,
    } = req.body
    const passwordHash = await bcrypt.hash(password, +SALT_LENGTH)

    let user = await User.create({
      email,
      password: passwordHash,
      name,
    })

    user = user.toObject()
    delete user.password
    res.status(201).send(user)
  } catch (err) {
    if (err.name === 'MongoServerError' && err.code === 11000) {
      next(new ConflictError('Пользователь с таким email уже существует'))
      return
    }

    if (err instanceof mongoose.Error) {
      next(handleMongooseError(err))
      return
    }

    next(err)
  }
}

async function login(req, res, next) {
  try {
    const {
      email, password,
    } = req.body

    const user = await User.findOne({
      email,
    }).select('+password')

    if (!user) {
      throw new UnauthorizedError('Неверные данные для входа')
    }

    const hasRightPassword = await bcrypt.compare(password, user.password)

    if (!hasRightPassword) {
      throw new UnauthorizedError('Неверные данные для входа')
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      NODE_ENV === 'production' ? JWT_SECRET : 'secret',
      {
        expiresIn: '7d',
      },
    )

    res.send({
      token,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getUserInfo, updateUserInfo, createUser, login,
}
