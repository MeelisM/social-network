import React from 'react';
import { Modal, Paper, Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';

const GroupInviteModal = ({ open, onClose, groups, onInvite, loading }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        sx={{
          padding: 4,
          width: "400px",
          backgroundColor: "#1f1f1f",
          color: "#ffffff",
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Select a Group
        </Typography>
        {groups.length === 0 ? (
          <Typography>No groups available for invitation.</Typography>
        ) : (
          <List>
            {groups.map((group) => (
              <ListItem
                button
                key={group.id}
                onClick={() => onInvite(group.id)}
              >
                <ListItemText
                  primary={group.title}
                  secondary={group.description || "No description"}
                  sx={{ color: "white" }}
                />
              </ListItem>
            ))}
          </List>
        )}
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              color: "white",
              marginTop: 2,
              display: "block",
              margin: "0 auto",
            }}
          />
        )}
      </Paper>
    </Modal>
  );
};

export default GroupInviteModal;