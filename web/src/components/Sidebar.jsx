import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // current user data
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import InfoIcon from "@mui/icons-material/Info";
import ExploreIcon from "@mui/icons-material/Explore";

function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth(); // current user data

  const profileUrl = user?.user_id ? `/profile/${user.user_id}` : "/profile";

  return (
    <Box sx={{ width: 240, bgcolor: "#1f1f1f", color: "white", paddingTop: 2 }}>
      <List>
        <ListItem button onClick={() => navigate("/main")}>
          <ListItemIcon>
            <HomeIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Home"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            navigate(profileUrl);
          }}
        >
          <ListItemIcon>
            <AccountCircleIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Profile"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <SettingsIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
      </List>
      <Divider sx={{ bgcolor: "#90caf9", marginY: 2 }} />

      <Typography
        variant="subtitle2"
        sx={{ paddingLeft: 2, color: "#90caf9", fontSize: "1.1rem" }}
      >
        For You
      </Typography>
      <List>
        <ListItem button>
          <ListItemIcon>
            <ExploreIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Your Groups"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <GroupsIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Joined Groups"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
        <ListItem button onClick={() => navigate("/followers")}>
          <ListItemIcon>
            <PeopleIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Followers"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <FavoriteIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Favourites"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
      </List>
      <Divider sx={{ bgcolor: "#90caf9", marginY: 2 }} />

      <Typography
        variant="subtitle2"
        sx={{ paddingLeft: 2, color: "#90caf9", fontSize: "1.1rem" }}
      >
        Explore
      </Typography>
      <List>
        <ListItem button>
          <ListItemIcon>
            <GroupsIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="All Groups"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
        <ListItem button onClick={() => navigate("/users")}>
          <ListItemIcon>
            <PeopleIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="All Users"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <PeopleIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="New Members"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
      </List>
      <Divider sx={{ bgcolor: "#90caf9", marginY: 2 }} />

      <Typography
        variant="subtitle2"
        sx={{ paddingLeft: 2, color: "#90caf9", fontSize: "1.1rem" }}
      >
        About Us
      </Typography>
      <List>
        <ListItem button>
          <ListItemIcon>
            <InfoIcon color="primary" fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="Developer Blog"
            primaryTypographyProps={{ variant: "h6", color: "white" }}
          />
        </ListItem>
      </List>
    </Box>
  );
}

export default Sidebar;
