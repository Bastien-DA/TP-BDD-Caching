import express from 'express';
import { AddProducts, GetProduct, UpdateProduct } from './Products';

export const app = express();
const port = 8000;

app.use(express.json());

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await GetProduct(id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, price_cents } = req.body;

    if (!name || !price_cents) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const product = await AddProducts(name, price_cents);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error creating product' });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const product = await UpdateProduct(id, name, price);
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));