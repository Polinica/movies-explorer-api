const {
  mongoose,
} = require('mongoose')

const {
  Movie,
} = require('../models/movie')

const {
  NotFoundError, ForbiddenError, ConflictError,
} = require('../errors')

const {
  handleMongooseError,
} = require('../utils/handleMongooseError')

async function getMovies(req, res, next) {
  try {
    const movies = await Movie.find({
    }).populate('owner')
    res.send(movies)
  } catch (err) {
    next(err)
  }
}

async function saveMovie(req, res, next) {
  try {
    const {
      country,
      director,
      duration,
      year,
      description,
      image,
      trailerLink,
      thumbnail,
      nameRU,
      nameEN,
      movieId,
    } = req.body

    const ownerId = req.user._id

    const movie = await Movie.create({
      country,
      director,
      duration,
      year,
      description,
      image,
      trailerLink,
      thumbnail,
      nameRU,
      nameEN,
      movieId,
      owner: ownerId,
    })

    await movie.populate('owner')
    res.status(201).send(movie)
  } catch (err) {
    if (err.code === 11000) {
      next(new ConflictError('Фильм с таким id уже существует'))
      return
    }

    if (err instanceof mongoose.Error) {
      next(handleMongooseError(err))
      return
    }

    next(err)
  }
}

// # удаляет сохранённый фильм по id
async function deleteMovie(req, res, next) {
  try {
    const {
      id,
    } = req.params

    const movie = await Movie.findById(id).populate('owner')

    if (!movie) {
      throw new NotFoundError('Фильм не найден')
    }

    const ownerId = movie.owner.id
    const userId = req.user._id

    if (ownerId !== userId) {
      throw new ForbiddenError('Удалить фильм может только владелец')
    }

    await Movie.findByIdAndRemove(id)

    res.send(movie)
  } catch (err) {
    if (err instanceof mongoose.Error) {
      next(handleMongooseError(err))
      return
    }
    next(err)
  }
}

module.exports = {
  getMovies, saveMovie, deleteMovie,
}
