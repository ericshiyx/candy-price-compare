import React from 'react';
import { Container, Typography } from '@mui/material';
import PriceComparison from './components/PriceComparison';
import AddProduct from './components/AddProduct';

function App() {
  const handleProductAdded = () => {
    // Refresh the price comparison table
    window.location.reload();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Candy Store Price Comparison
      </Typography>
      <AddProduct onProductAdded={handleProductAdded} />
      <PriceComparison />
    </Container>
  );
}

export default App;
