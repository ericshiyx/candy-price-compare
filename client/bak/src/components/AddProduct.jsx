import React, { useState } from 'react';
import axios from 'axios';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography,
  Box,
  Alert,
  Snackbar
} from '@mui/material';

const AddProduct = ({ onProductAdded, onRefreshList }) => {
  const [formData, setFormData] = useState({
    name: '',
    vendor1Url: '',
    vendor2Url: '',
    vendor1Price: '',
    vendor2Price: '',
    vendor1Domain: '',
    vendor2Domain: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [validUrls, setValidUrls] = useState({ vendor1: false, vendor2: false });

  const handleUrlChange = async (e, vendor) => {
    const url = e.target.value;
    console.log(`${vendor} URL changed:`, url);
    
    // Always update the URL in the form first
    setFormData(prev => ({
      ...prev,
      [`${vendor}Url`]: url
    }));

    // Clear previous errors and validation for this vendor
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${vendor}Url`];
      delete newErrors[`${vendor}Domain`];
      return newErrors;
    });
    
    setValidUrls(prev => ({
      ...prev,
      [vendor]: false
    }));

    if (!url) {
      return; // Exit if URL is empty
    }

    setIsScraping(true);
    try {
      // Try to extract domain from URL first
      const domain = new URL(url).hostname;
      
      // Validate domain
      if (!domain.includes('candyville.ca') && !domain.includes('candynow.ca')) {
        throw new Error('Invalid vendor domain. Please use candyville.ca or candynow.ca');
      }
      
      // Update domain immediately
      setFormData(prev => ({
        ...prev,
        [`${vendor}Domain`]: domain
      }));

      // Then try to scrape price and image
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/products/scrape`, {
        url: url
      });
      
      console.log(`${vendor} scrape response:`, response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Update price and image if available
      setFormData(prev => ({
        ...prev,
        [`${vendor}Price`]: response.data.price || 0,
        ...(vendor === 'vendor1' ? { imageUrl: response.data.imageUrl || '' } : {})
      }));

      // Mark URL as valid if we got here without errors
      setValidUrls(prev => {
        const newValidUrls = {
          ...prev,
          [vendor]: true
        };
        console.log('Updated validUrls:', newValidUrls);
        return newValidUrls;
      });

    } catch (error) {
      console.error(`${vendor} URL error:`, error.message);
      const errorMsg = error.response?.data?.error || error.message;
      
      setErrors(prev => ({
        ...prev,
        [`${vendor}Url`]: errorMsg
      }));
      
      setErrorMessage(errorMsg);
      setShowError(true);
      
      // Reset valid status for this vendor
      setValidUrls(prev => ({
        ...prev,
        [vendor]: false
      }));
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    setErrorMessage('');
    
    // Validate required fields
    const requiredFields = ['name', 'vendor1Url', 'vendor2Url', 'vendor1Domain', 'vendor2Domain'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      const newErrors = missingFields.reduce((acc, field) => {
        acc[field] = 'This field is required';
        return acc;
      }, {});
      setErrors(newErrors);
      setErrorMessage('Please fill in all required fields');
      setShowError(true);
      return;
    }

    if (isScraping) {
      setErrorMessage('Still scraping prices, please wait...');
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      // Ensure all required fields are present and properly formatted
      const productData = {
        name: formData.name.trim(),
        vendor1Url: formData.vendor1Url.trim(),
        vendor2Url: formData.vendor2Url.trim(),
        vendor1Price: parseFloat(formData.vendor1Price) || 0,
        vendor2Price: parseFloat(formData.vendor2Price) || 0,
        vendor1Domain: formData.vendor1Domain || new URL(formData.vendor1Url).hostname,
        vendor2Domain: formData.vendor2Domain || new URL(formData.vendor2Url).hostname,
        imageUrl: formData.imageUrl || ''
      };

      console.log('Sending data:', productData);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/products`, productData);
      console.log('Response:', response.data);
      
      // Clear form
      setFormData({
        name: '',
        vendor1Url: '',
        vendor2Url: '',
        vendor1Price: '',
        vendor2Price: '',
        vendor1Domain: '',
        vendor2Domain: '',
        imageUrl: ''
      });
      setErrors({});
      setErrorMessage('');
      
      // Refresh product list
      const responseData = await axios.get(`${process.env.REACT_APP_API_URL}/api/products`);
      onProductAdded(responseData.data);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        data: error.response?.data,
        validationErrors: error.response?.data?.validationErrors
      });
      
      // Handle validation errors
      if (error.response?.data?.validationErrors) {
        setErrors(error.response.data.validationErrors);
        setErrorMessage('Please correct the validation errors');
        setShowError(true);
      }
      
      // Handle missing fields
      if (error.response?.data?.missingFields) {
        const newErrors = error.response.data.missingFields.reduce((acc, field) => {
          acc[field] = 'This field is required';
          return acc;
        }, {});
        setErrors(prev => ({ ...prev, ...newErrors }));
        setErrorMessage('Please fill in all required fields');
        setShowError(true);
      }
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    console.log('Refresh button clicked');
    setRefreshing(true);
    try {
      console.log('Making request to refresh prices...');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/products/refresh-prices`);
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

  // Helper function to check if form is valid
  const isFormValid = () => {
    console.log('Checking form validity:', {
      name: formData.name,
      validUrls,
      isScraping,
      loading,
      errors: Object.keys(errors),
    });

    const isValid = (
      formData.name && // Name is required
      validUrls.vendor1 && // Vendor 1 URL is valid
      validUrls.vendor2 && // Vendor 2 URL is valid
      !isScraping && // Not currently scraping
      !loading && // Not currently loading
      Object.keys(errors).length === 0 // No errors
    );

    console.log('Form is valid:', isValid);
    return isValid;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Add New Product
      </Typography>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Product Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          margin="normal"
          required
          name="name"
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          fullWidth
          label="Vendor 1 URL"
          value={formData.vendor1Url}
          onChange={(e) => handleUrlChange(e, 'vendor1')}
          margin="normal"
          required
          name="vendor1Url"
          error={!!errors.vendor1Url}
          helperText={errors.vendor1Url || (validUrls.vendor1 ? 'Valid URL' : '')}
        />
        <TextField
          fullWidth
          label="Vendor 2 URL"
          value={formData.vendor2Url}
          onChange={(e) => handleUrlChange(e, 'vendor2')}
          margin="normal"
          required
          name="vendor2Url"
          error={!!errors.vendor2Url}
          helperText={errors.vendor2Url || (validUrls.vendor2 ? 'Valid URL' : '')}
        />
        <div className="flex">
          <Button 
            variant="contained" 
            type="submit" 
            sx={{ mt: 2 }}
            disabled={!isFormValid()}
          >
            {loading ? 'ADDING...' : isScraping ? 'SCRAPING...' : 'ADD PRODUCT'}
          </Button>          
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
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert onClose={() => setShowError(false)} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AddProduct; 