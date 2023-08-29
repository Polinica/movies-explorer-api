const {
  ValidationError,
} = require('../errors')

function handleMongooseError(err) {
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    const fieldName = Object.keys(err.errors)[0]
    return new ValidationError(`Неверные данные в поле '${fieldName}'`)
  }

  return err
}

module.exports = {
  handleMongooseError,
}
