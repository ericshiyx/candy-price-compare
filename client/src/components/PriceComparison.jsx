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
  IconButton,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const PriceComparison = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/products`);
      // Sort products by sequencenum if it exists
      const sortedProducts = response.data.sort((a, b) => (a.sequencenum || 0) - (b.sequencenum || 0));
      setProducts(sortedProducts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error loading products');
      setShowError(true);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/products/${id}`);
      // After successful deletion, fetch the updated list
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Error deleting product');
      setShowError(true);
    }
  };

  const moveItem = async (index, direction) => {
    try {
      const newProducts = [...products];
      let targetIndex;

      if (direction === 'up' && index > 0) {
        targetIndex = index - 1;
      } else if (direction === 'down' && index < products.length - 1) {
        targetIndex = index + 1;
      } else {
        return; // Invalid move
      }

      // Swap items in the local state first for immediate feedback
      [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
      
      // Update the local state immediately
      setProducts(newProducts);

      // Prepare the reorder request
      const reorderData = {
        productId: products[index]._id,
        direction: direction
      };

      // Send the reorder request to the server
      await axios.post(`${process.env.REACT_APP_API_URL}/api/products/reorder`, reorderData);
      
      // Fetch the updated list to ensure we're in sync with the server
      await fetchProducts();
    } catch (error) {
      console.error('Error moving item:', error);
      setError('Error reordering items');
      setShowError(true);
      // Revert to the original order by fetching again
      await fetchProducts();
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <div className="container">
      <h1 style={{ 
        fontWeight: 'bold',
        fontSize: '2rem',
        marginBottom: '20px'
      }}>
        Price Comparison
      </h1>
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
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton 
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        size="small"
                      >
                        <ArrowUpwardIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === products.length - 1}
                        size="small"
                      >
                        <ArrowDownwardIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(product._id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert onClose={() => setShowError(false)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PriceComparison; 