package handler

import (
	"encoding/json"
	"net/http"
	"social-network/internal/model"
	"social-network/internal/service"
)

type GroupHandler struct {
	GroupService *service.GroupService
}

func (h *GroupHandler) HandleGroups(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.GetAllGroups(w, r)
	case http.MethodPost:
		h.CreateGroup(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *GroupHandler) GetAllGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := h.GroupService.GetAllGroups()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(groups)
}

func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	var input model.CreateGroupInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	group, err := h.GroupService.CreateGroup(userID, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(group)
}

func (h *GroupHandler) HandleInvite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		GroupID string   `json:"group_id"`
		UserIDs []string `json:"user_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	if err := h.GroupService.InviteToGroup(input.GroupID, userID, input.UserIDs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *GroupHandler) HandlePosts(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	switch r.Method {
	case http.MethodPost:
		h.CreateGroupPost(w, r, userID)
	case http.MethodGet:
		h.GetGroupPosts(w, r, userID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *GroupHandler) CreateGroupPost(w http.ResponseWriter, r *http.Request, userID string) {
	var input struct {
		GroupID   string  `json:"group_id"`
		Content   string  `json:"content"`
		ImagePath *string `json:"image_path,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	post, err := h.GroupService.CreateGroupPost(input.GroupID, userID, input.Content, input.ImagePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(post)
}

func (h *GroupHandler) GetGroupPosts(w http.ResponseWriter, r *http.Request, userID string) {
	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		http.Error(w, "group_id is required", http.StatusBadRequest)
		return
	}

	posts, err := h.GroupService.GetGroupPosts(groupID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(posts)
}

func (h *GroupHandler) HandleEvents(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	switch r.Method {
	case http.MethodPost:
		h.CreateGroupEvent(w, r, userID)
	case http.MethodGet:
		h.GetGroupEvents(w, r, userID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *GroupHandler) CreateGroupEvent(w http.ResponseWriter, r *http.Request, userID string) {
	var input struct {
		GroupID string                 `json:"group_id"`
		Event   model.CreateEventInput `json:"event"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := h.GroupService.CreateEvent(input.GroupID, userID, input.Event)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(event)
}

func (h *GroupHandler) HandleInviteResponse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		GroupID string `json:"group_id"`
		UserID  string `json:"user_id"`
		Accept  bool   `json:"accept"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	responderID := r.Context().Value("user_id").(string)
	if err := h.GroupService.RespondToInvite(input.GroupID, input.UserID, responderID, input.Accept); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *GroupHandler) GetPendingInvites(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(string)
	invites, err := h.GroupService.GetPendingInvites(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(invites)
}

func (h *GroupHandler) GetGroupEvents(w http.ResponseWriter, r *http.Request, userID string) {
	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		http.Error(w, "group_id is required", http.StatusBadRequest)
		return
	}

	events, err := h.GroupService.GetGroupEvents(groupID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(events)
}

func (h *GroupHandler) HandleEventResponse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input model.EventResponse
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	if err := h.GroupService.RespondToEvent(input.EventID, userID, input.Response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *GroupHandler) GetEventResponses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	eventID := r.URL.Query().Get("event_id")
	if eventID == "" {
		http.Error(w, "event_id is required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	responses, err := h.GroupService.GetEventResponses(eventID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(responses)
}

func (h *GroupHandler) GetGroupMembers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		http.Error(w, "group_id is required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	members, err := h.GroupService.GetGroupMembers(groupID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(members)
}

func (h *GroupHandler) RequestToJoinGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		GroupID string `json:"group_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	if err := h.GroupService.RequestToJoinGroup(input.GroupID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *GroupHandler) GetGroupJoinRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		http.Error(w, "group_id is required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	requests, err := h.GroupService.GetGroupJoinRequests(groupID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(requests)
}

func (h *GroupHandler) GetUserGroups(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(string)

	groups, err := h.GroupService.GetUserGroups(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(groups)
}
