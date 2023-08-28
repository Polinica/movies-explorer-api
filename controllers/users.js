/* GET /users/:userId - возвращает пользователя по _id
   GET /users — возвращает всех пользователей
   POST /users — создаёт пользователя
   PATCH /users/me — обновляет профиль
   PATCH /users/me/avatar — обновляет аватар профиля
*/

const {
  User,
} = require('../models/user')
const {
  NotFoundError,
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

module.exports = {
  getUserInfo,
}
