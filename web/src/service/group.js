import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

// Group management
export const getOwnedGroups = () => API.get("/groups/user", { params: { type: "owned" } }); 
export const getJoinedGroups = () => API.get("/groups/user", { params: { type: "joined" } }); 
export const getAllGroups = () => API.get("/groups");
export const createGroup = (data) => API.post("/groups", data);

// Corrected `getGroupDetails` to use query parameters
export const getGroupDetails = (groupId) =>
  API.get("/groups", { params: { group_id: groupId } });

// Group posts
export const getGroupPosts = (groupId) =>
  API.get("/groups/posts", { params: { group_id: groupId } });
export const createGroupPost = (groupId, data) =>
  API.post("/groups/posts", { group_id: groupId, ...data });
  export const createPostComment = (data) =>
  API.post("/groups/posts/comments", data);
  export const createGroupPostComment = (groupId, data) =>
  API.post("/groups/posts/comments", { group_id: groupId, ...data });

// Group events
export const getGroupEvents = (groupId) =>
  API.get("/groups/events", { params: { group_id: groupId } });
export const createGroupEvent = (groupId, data) =>
  API.post("/groups/events", { group_id: groupId, ...data });
export const respondToEvent = (eventId, data) =>
  API.post("/groups/events/respond", { event_id: eventId, ...data });
export const getEventResponses = (eventId) =>
  API.get("/groups/events/responses", { params: { event_id: eventId } });

// Group members
export const getGroupMembers = (groupId) =>
  API.get("/groups/members", { params: { group_id: groupId } });
export const inviteToGroup = (groupId, userIds) =>
  API.post("/groups/invite", { group_id: groupId, user_ids: userIds });
export const getGroupJoinRequests = (groupId) =>
  API.get("/groups/requests", { params: { group_id: groupId } });
export const respondToGroupJoinRequest = (groupId, userId, accept) =>
  API.post("/groups/invites/respond", { group_id: groupId, user_id: userId, accept });

// Group join requests
export const requestToJoinGroup = (groupId) =>
  API.post("/groups/join", { group_id: groupId });

// Pending invites
export const getPendingInvites = () => API.get("/groups/invites");

export default API;
