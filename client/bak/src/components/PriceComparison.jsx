import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const PriceComparison = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      // After successful deletion, fetch the updated list
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Img</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Product</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Vendor 1</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '5%' }}>Vendor 1 Price</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Vendor 2</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '5%' }}>Vendor 2 Price</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '10%' }}>Savings</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '30%' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => {
            const savings = (product.vendor1Price - product.vendor2Price) || 0;
            const vendor1Color = savings < 0 ? 'red' : 'inherit';
            const vendor2Color = savings > 0 ? 'red' : 'inherit';

            return (
              <TableRow key={product._id}>
                <TableCell>
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                  )}
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell sx={{ color: vendor1Color }}>{product.vendor1Domain}</TableCell>
                <TableCell align="right" sx={{ color: vendor1Color }}>
                  ${product.vendor1Price?.toFixed(2)}
                </TableCell>
                <TableCell sx={{ color: vendor2Color }}>{product.vendor2Domain}</TableCell>
                <TableCell align="right" sx={{ color: vendor2Color }}>
                  ${product.vendor2Price?.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  ${savings.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleDelete(product._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PriceComparison; 