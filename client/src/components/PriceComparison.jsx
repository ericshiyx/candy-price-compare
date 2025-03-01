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
import { ArrowUpward, ArrowDownward, Delete } from '@mui/icons-material';

const PriceComparison = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/products`);
        const sortedProducts = response.data.sort((a, b) => a.sequence - b.sequence);
        setProducts(sortedProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/products/${id}`);
      setProducts(products.filter(product => product._id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const moveItem = async (index, direction) => {
    const newProducts = [...products];
    if (direction === 'up' && index > 0) {
      [newProducts[index], newProducts[index - 1]] = [newProducts[index - 1], newProducts[index]];
    } else if (direction === 'down' && index < products.length - 1) {
      [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
    }
    setProducts(newProducts);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/products/update-sequence`, {
        products: newProducts
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error updating sequence:', error);
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
          {products.map((product, index) => {
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
                  <IconButton 
                    onClick={() => moveItem(index, 'up')} 
                    disabled={index === 0}
                  >
                    <ArrowUpward />
                  </IconButton>
                  <IconButton 
                    onClick={() => moveItem(index, 'down')} 
                    disabled={index === products.length - 1}
                  >
                    <ArrowDownward />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(product._id)}>
                    <Delete />
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