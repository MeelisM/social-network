import React, { useState, useEffect } from "react";
import { Button, Modal, Paper, TextField, Typography, Radio, RadioGroup, FormControlLabel, List, ListItem } from "@mui/material";
import { createGroupEvent, respondToEvent, getEventResponses } from "../../service/groupService";
import { useAuth } from "../../context/AuthContext";

const Event = ({ groupId, events, setEvents }) => {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", eventTime: "" });
  const [eventResponses, setEventResponses] = useState({}); // Store responses for each event
  const { user } = useAuth(); // Fetch current user from context

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        // Fetch responses for each event and update state
        const responses = {};
        for (const event of events) {
          const response = await getEventResponses(event.id);
          responses[event.id] = response.data; // Assuming API returns responses in `data`
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
        title: newEvent.title,
        description: newEvent.description,
        event_time: eventTime,
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

      // Fetch updated responses for the event
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
            sx={{
              padding: 2,
              marginBottom: 2,
              backgroundColor: "#1f1f1f",
            }}
          >
            <Typography variant="h6">{event.title}</Typography>
            <Typography variant="body2">{event.description}</Typography>
            <Typography variant="caption" sx={{ color: "#b0bec5" }}>
              Scheduled for {new Date(event.event_time).toLocaleString()}
            </Typography>

            <Typography variant="body2" sx={{ marginTop: 1 }}>
              Response:
            </Typography>
            <RadioGroup
              row
              onChange={(e) => handleResponse(event.id, e.target.value)}
            >
              <FormControlLabel value="going" control={<Radio />} label="Going" />
              <FormControlLabel value="not_going" control={<Radio />} label="Not Going" />
            </RadioGroup>

            {/* Display Responses */}
            {eventResponses[event.id] && (
              <>
                <Typography variant="body2" sx={{ marginTop: 2 }}>
                  Responses:
                </Typography>
                <List>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Going:</strong>{" "}
                      {eventResponses[event.id].going?.length > 0
                        ? eventResponses[event.id].going.join(", ")
                        : "No one yet"}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Not Going:</strong>{" "}
                      {eventResponses[event.id].not_going?.length > 0
                        ? eventResponses[event.id].not_going.join(", ")
                        : "No one yet"}
                    </Typography>
                  </ListItem>
                </List>
              </>
            )}
          </Paper>
        ))
      ) : (
        <Typography>No events yet.</Typography>
      )}

      {/* Event Modal */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Paper sx={{ padding: 4, backgroundColor: "#1f1f1f", width: "400px" }}>
          <Typography variant="h5" sx={{ marginBottom: 3 }}>
            Create New Event
          </Typography>
          <TextField
            fullWidth
            placeholder="Event Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            type="datetime-local"
            fullWidth
            value={newEvent.eventTime || ""}
            onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
            sx={{ marginBottom: 3 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Event Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            sx={{ marginBottom: 3 }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreateEvent}
            sx={{ backgroundColor: "#333", "&:hover": { backgroundColor: "#555" } }}
          >
            Create Event
          </Button>
        </Paper>
      </Modal>
    </div>
  );
};

export default Event;
