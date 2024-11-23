package notification

type Service interface {
	CreateNotification(userID string, notificationType string, content string, referenceID string) error
}
