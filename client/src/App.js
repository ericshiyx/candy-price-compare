import React from 'react';
import { Container } from '@mui/material';
import PriceComparison from './components/PriceComparison';
import AddProduct from './components/AddProduct';

function App() {
  const handleProductAdded = () => {
    // Refresh the price comparison table
    window.location.reload();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>      
      <AddProduct onProductAdded={handleProductAdded} />
      <PriceComparison />
    </Container>
  );
}

export default App;
