import animeRoutes from './anime.js';

const constructorMethod = (app) => {
  app.use('/', animeRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({error: 'Not found'});
  });
};

export default constructorMethod;