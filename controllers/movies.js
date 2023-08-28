const {
  Movie,
} = require('../models/movie')

const {
  ValidationError, NotFoundError, ForbiddenError,
} = require('../errors')

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
    if (err.name === 'CastError' || err.name === 'ValidationError') {
      next(new ValidationError(`Неверные данные в ${err.path ?? 'запросе'}`))
      return
    }

    next(err)
  }
}

// # удаляет сохранённый фильм по id
async function deleteMovie(req, res, next) {
  try {
    const {
      movieId,
    } = req.params

    const movie = await Movie.findById(movieId).populate('owner')

    if (!movie) {
      throw new NotFoundError('Фильм не найден')
    }

    const ownerId = movie.owner.id
    const userId = req.user._id

    if (ownerId !== userId) {
      throw new ForbiddenError('Удалить фильм может только владелец')
    }

    await Movie.findByIdAndRemove(movieId)

    res.send(movie)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getMovies, saveMovie, deleteMovie,
}