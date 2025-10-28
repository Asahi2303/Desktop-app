import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const FinishSignup: React.FC = () => {
  const goToLogin = () => {
    // Navigate back to root; the app will show the login form
    window.location.href = '/';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', p: 3 }}>
      <Box sx={{ maxWidth: 520, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          You're all set
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Your password has been updated. You can now sign in to the desktop app with your email and the new password.
        </Typography>
        <Button variant="contained" onClick={goToLogin} sx={{ mb: 4 }}>
          Go to Login
        </Button>
        <Typography variant="body2" color="text.secondary">
          If this window was opened from an invite link, you can close it and return to the app.
        </Typography>
      </Box>
    </Box>
  );
};

export default FinishSignup;
