import React, { useState } from 'react';
import axios from 'axios';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography,
  Box,
  // Snackbar,
  // Alert
} from '@mui/material';

const AddProduct = ({ onProductAdded, onRefreshList }) => {
  const [productName, setProductName] = useState('');
  const [vendor1Url, setVendor1Url] = useState('');
  const [vendor2Url, setVendor2Url] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  //const [comparing, setComparing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName || !vendor1Url || !vendor2Url) {
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/products/compare-price', {
        name: productName,
        vendor1Url,
        vendor2Url
      });
      setProductName('');
      setVendor1Url('');
      setVendor2Url('');
      const response = await axios.get('http://localhost:5000/api/products');
      onProductAdded(response.data);
    } catch (error) {
      console.error('Error adding product:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    console.log('Refresh button clicked');
    setRefreshing(true);
    try {
      console.log('Making request to refresh prices...');
      const response = await axios.post('http://localhost:5000/api/products/refresh-prices');
      console.log('Got response from server:', response.data);
      if (onRefreshList && typeof onRefreshList === 'function') {
        console.log('Calling onRefreshList with updated data');
        onRefreshList(response.data);
        console.log('List should be updated now');
      } else {
        console.warn('onRefreshList is not a function:', onRefreshList);
      }
    } catch (error) {
      console.error('Error refreshing prices:', error);
    }
    setRefreshing(false);
    console.log('Refresh completed');
  };

  /* const handleAutoCompare = async (e) => {
    e.preventDefault();
    
    // Only check vendor URLs for Auto Compare
    if (!vendor1Url || !vendor2Url) {
      // Focus the first empty vendor URL field
      if (!vendor1Url) {
        document.querySelector('input[name="vendor1Url"]')?.focus();
      } else {
        document.querySelector('input[name="vendor2Url"]')?.focus();
      }
      return;
    }

    console.log('Auto Compare button clicked');
    setComparing(true);
    try {
      console.log('Starting auto comparison...');
      const response = await axios.post('http://localhost:5000/api/products/auto-compare');
      console.log(`Added ${response.data.length} new product comparisons`);
      if (onRefreshList && typeof onRefreshList === 'function') {
        onRefreshList(response.data);
      }
    } catch (error) {
      console.error('Error in auto comparison:', error);
    }
    setComparing(false);
  };
 */
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Add New Product
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          margin="normal"
          required
          name="productName"
        />
        <TextField
          fullWidth
          label="Vendor 1 URL"
          value={vendor1Url}
          onChange={(e) => setVendor1Url(e.target.value)}
          margin="normal"
          required
          name="vendor1Url"
        />
        <TextField
          fullWidth
          label="Vendor 2 URL"
          value={vendor2Url}
          onChange={(e) => setVendor2Url(e.target.value)}
          margin="normal"
          required
          name="vendor2Url"
        />
        <div className="flex">
          <Button 
            variant="contained" 
            type="submit" 
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'ADDING...' : 'ADD PRODUCT'}
          </Button>
          {/* <Button 
            variant="contained" 
            type="button"
            onClick={handleAutoCompare}
            sx={{ mt: 2, ml: 2 }}
            disabled={comparing}
          >
            {comparing ? 'COMPARING...' : 'AUTO COMPARE'}
          </Button> */}
          <Button 
            variant="contained" 
            type="button" 
            onClick={handleRefresh}
            sx={{ mt: 2, ml: 2 }}
            disabled={refreshing}
          >
            {refreshing ? 'REFRESHING...' : 'REFRESH LIST'}
          </Button>
        </div>
      </Box>
    </Paper>
  );
};

export default AddProduct; 