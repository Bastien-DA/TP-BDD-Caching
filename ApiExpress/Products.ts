import pgPromise from "pg-promise";
import redis from './redis';

const pgp = pgPromise();
const db = pgp('postgres://app:app_pwd@localhost:5439/appdb');

async function GetProduct(id: number) {
  try {
    // Vérifier le cache
    const cached = await redis.get(`product:${id}`);
    if (cached) {
        return JSON.parse(cached);
    }

    // Si pas en cache, récupérer de la DB
    const product = await db.one('SELECT * FROM products WHERE id = $1', [id]);

    await redis.setex(`product:${id}`, 120, JSON.stringify(product));

    return product;
  } catch (error) {
    console.error('Error retrieving product:', error);
    throw error;
  }
}

async function AddProducts(name: string, price_cents: number) {
  try {
    const result = await db.one(
      'INSERT INTO products(name, price_cents, updated_at) VALUES($1, $2, CURRENT_DATE) RETURNING *',
      [name, price_cents]
    );

    await redis.setex(`product:${result.id}`, 120, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

async function UpdateProduct(id: number, name: string, price_cents: number) {
    try {
        const result = await db.one(
            'UPDATE products SET name = $1, price_cents = $2, updated_at = CURRENT_DATE WHERE id = $3 RETURNING *',
            [name, price_cents, id]
        );

        // Invalider l'ancienne clé
        await redis.del(`product:${id}`);

        // Mettre en cache le produit mis à jour
        await redis.setex(`product:${id}`, 120, JSON.stringify(result));

        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

export { AddProducts, GetProduct, UpdateProduct };
