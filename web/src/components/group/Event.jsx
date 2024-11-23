import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Paper,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  List,
  ListItem,
  Box,
} from "@mui/material";
import { createGroupEvent, respondToEvent, getEventResponses } from "../../service/groupService";
import { useAuth } from "../../context/AuthContext";

const Event = ({ groupId, events, setEvents }) => {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", eventTime: "" });
  const [eventResponses, setEventResponses] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const responses = {};
        for (const event of events) {
          const response = await getEventResponses(event.id);
          responses[event.id] = response.data;
        }
        setEventResponses(responses);
      } catch (error) {
        console.error("Error fetching event responses:", error);
      }
    };

    if (events.length > 0) fetchResponses();
  }, [events]);

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.eventTime.trim()) return;

    try {
      const eventTime = new Date(newEvent.eventTime).toISOString();

      const payload = {
        group_id: groupId,
        event: {
          title: newEvent.title,
          description: newEvent.description,
          event_time: eventTime,
        },
      };

      const response = await createGroupEvent(groupId, payload);

      setEvents((prevEvents) => [response.data, ...prevEvents]);
      setNewEvent({ title: "", description: "", eventTime: "" });
      setEventModalOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleResponse = async (eventId, response) => {
    try {
      await respondToEvent(eventId, { user_id: user.user_id, response });
      alert("Response submitted!");

      const updatedResponse = await getEventResponses(eventId);
      setEventResponses((prevResponses) => ({
        ...prevResponses,
        [eventId]: updatedResponse.data,
      }));
    } catch (error) {
      console.error("Error responding to event:", error);
    }
  };

  return (
    <div>
      {/* Button to Open Event Modal */}
      <Button
        variant="contained"
        onClick={() => setEventModalOpen(true)}
        sx={{
          backgroundColor: "#1f1f1f",
          color: "white",
          marginBottom: 3,
          "&:hover": { backgroundColor: "#333" },
        }}
      >
        + Create Event
      </Button>

      {/* Render Events */}
      {events?.length > 0 ? (
        events.map((event) => (
          <Paper
            key={event.id}
            elevation={4}
            sx={{
              padding: 3,
              marginBottom: 3,
              backgroundColor: "#1f1f1f",
              borderRadius: 4,
            }}
          >
            <Typography variant="h6" sx={{ color: "#ffffff", fontWeight: "bold" }}>
              {event.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "#b0bec5", marginTop: 1 }}>
              {event.description}
            </Typography>
            <Typography variant="caption" sx={{ color: "#90caf9", marginTop: 1, display: "block" }}>
              Scheduled for {new Date(event.event_time).toLocaleString()}
            </Typography>

            <Box sx={{ marginTop: 2 }}>
              <Typography variant="body2" sx={{ color: "#ffffff", marginBottom: 1 }}>
                Response:
              </Typography>
              <RadioGroup
                row
                onChange={(e) => handleResponse(event.id, e.target.value)}
                sx={{ justifyContent: "flex-start" }}
              >
                <FormControlLabel
                  value="going"
                  control={<Radio sx={{ color: "#90caf9" }} />}
                  label="Going"
                  sx={{ color: "#90caf9" }}
                />
                <FormControlLabel
                  value="not_going"
                  control={<Radio sx={{ color: "#ef9a9a" }} />}
                  label="Not Going"
                  sx={{ color: "#ef9a9a" }}
                />
              </RadioGroup>
            </Box>

            {/* Display Responses */}
            {eventResponses[event.id] && (
              <Box sx={{ marginTop: 2 }}>
                <Typography variant="body2" sx={{ color: "#ffffff", marginBottom: 1 }}>
                  Responses:
                </Typography>
                <List>
                  <ListItem disablePadding>
                    <Typography variant="body2" sx={{ color: "#90caf9" }}>
                      <strong>Going:</strong>{" "}
                      {eventResponses[event.id].going?.length > 0
                        ? eventResponses[event.id].going.join(", ")
                        : "No one yet"}
                    </Typography>
                  </ListItem>
                  <ListItem disablePadding>
                    <Typography variant="body2" sx={{ color: "#ef9a9a" }}>
                      <strong>Not Going:</strong>{" "}
                      {eventResponses[event.id].not_going?.length > 0
                        ? eventResponses[event.id].not_going.join(", ")
                        : "No one yet"}
                    </Typography>
                  </ListItem>
                </List>
              </Box>
            )}
          </Paper>
        ))
      ) : (
        <Typography variant="body1" sx={{ color: "#b0bec5", textAlign: "center" }}>
          No events yet.
        </Typography>
      )}

      {/* Event Modal */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Paper sx={{ padding: 4, backgroundColor: "#1f1f1f", width: "400px", borderRadius: 4 }}>
          <Typography variant="h5" sx={{ marginBottom: 3, color: "#ffffff", fontWeight: "bold" }}>
            Create New Event
          </Typography>
          <TextField
            fullWidth
            placeholder="Event Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            sx={{
              marginBottom: 2,
              "& .MuiInputLabel-root": { color: "#b0bec5" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#b0bec5" },
                "&:hover fieldset": { borderColor: "white" },
              },
              input: { color: "white" },
            }}
          />
          <TextField
            type="datetime-local"
            fullWidth
            value={newEvent.eventTime || ""}
            onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
            sx={{
              marginBottom: 3,
              "& .MuiInputLabel-root": { color: "#b0bec5" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#b0bec5" },
                "&:hover fieldset": { borderColor: "white" },
              },
              input: { color: "white" },
            }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Event Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            sx={{
              marginBottom: 3,
              "& .MuiInputLabel-root": { color: "#b0bec5" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#b0bec5" },
                "&:hover fieldset": { borderColor: "white" },
              },
              input: { color: "white" },
            }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreateEvent}
            sx={{
              backgroundColor: "#333",
              color: "white",
              "&:hover": { backgroundColor: "#555" },
            }}
          >
            Create Event
          </Button>
        </Paper>
      </Modal>
    </div>
  );
};

export default Event;
