import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Settings } from '@mui/icons-material';

const Header = () => {
  const navigate = useNavigate();

  return (
    <Menu>
      <MenuItem onClick={() => navigate('/settings')}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        <ListItemText>Cài đặt tài khoản</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default Header; 