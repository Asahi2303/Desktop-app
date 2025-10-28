import React from 'react';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const fromPath: string | undefined = location?.state?.from;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', p: 2 }}>
      <Card sx={{ maxWidth: 520, width: '100%', p: 1 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Access denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don’t have permission to view this page. If you think this is a mistake, please contact your administrator.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go to Home</Button>
            {fromPath && (
              <Button variant="outlined" onClick={() => navigate(fromPath)}>
                Back to previous
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccessDenied;
