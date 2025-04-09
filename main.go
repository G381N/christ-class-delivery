package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Student struct stores student details
type Student struct {
	Name  string `json:"name"`
	RegNo string `json:"regNo"`
	Block string `json:"block"`
	Room  string `json:"room"`
	Phone string `json:"phone"`
}

// OrderItem struct stores order item details
type OrderItem struct {
	Name     string  `json:"name"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Total    float64 `json:"total"`
}

// Order struct stores complete order details
type Order struct {
	ID                string      `json:"id"`
	Student           Student     `json:"student"`
	Items             []OrderItem `json:"items"`
	Subtotal          float64     `json:"subtotal"`
	GST               float64     `json:"gst"`
	ConvenienceCharge float64     `json:"convenienceCharge"`
	Total             float64     `json:"total"`
	Status            string      `json:"status"`
	Timestamp         string      `json:"timestamp"`
}

// Response struct for API responses
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Global variables
var (
	orders      = make(map[string]Order)
	ordersMutex sync.Mutex
	foodMenu    = []map[string]interface{}{
		{"name": "Idli", "price": 30.4, "image": "/static/images/idli.jpg"},
		{"name": "Dosa", "price": 40.3, "image": "/static/images/dosa.jpg"},
		{"name": "Poori", "price": 35.2, "image": "/static/images/poori.jpg"},
		{"name": "Sandwich", "price": 50.0, "image": "/static/images/sandwich.jpg"},
		{"name": "VegRoll", "price": 60.7, "image": "/static/images/vegroll.jpg"},
		{"name": "Pasta", "price": 100.0, "image": "/static/images/pasta.jpg"},
		{"name": "Pizza", "price": 120.0, "image": "/static/images/pizza.jpg"},
		{"name": "Burger", "price": 80.7, "image": "/static/images/burger.jpg"},
	}
)

// Channels for order processing
var (
	newOrderChannel     = make(chan Order)
	orderStatusChannel  = make(chan Order)
	orderResultChannel  = make(chan Order)
	notificationChannel = make(chan string)
)

// generateOrderID generates a unique order ID
func generateOrderID() string {
	return fmt.Sprintf("ORD%d", time.Now().UnixNano())
}

// validateOrder validates the order data
func validateOrder(order Order) error {
	if order.Student.Name == "" {
		return fmt.Errorf("student name is required")
	}
	if order.Student.RegNo == "" {
		return fmt.Errorf("registration number is required")
	}
	if len(order.Items) == 0 {
		return fmt.Errorf("order must contain at least one item")
	}

	for _, item := range order.Items {
		if item.Quantity < 1 || item.Quantity > 3 {
			return fmt.Errorf("quantity must be between 1 and 3")
		}
	}

	return nil
}

// processOrder handles order processing
func processOrder(wg *sync.WaitGroup) {
	defer wg.Done()

	for order := range newOrderChannel {
		log.Printf("Processing order: %s", order.ID)

		// Simulate order processing time
		time.Sleep(1 * time.Second)

		// Update order status
		order.Status = "Processing"
		orderStatusChannel <- order

		// Simulate delivery assignment
		time.Sleep(1 * time.Second)

		// Update order status
		order.Status = "Ready for Delivery"
		orderStatusChannel <- order

		// Simulate delivery in progress
		time.Sleep(1 * time.Second)

		// Update final order status
		order.Status = "Delivered"
		orderResultChannel <- order

		// Send notification
		notificationChannel <- fmt.Sprintf("Order %s has been delivered successfully", order.ID)
	}
}

// updateOrderStatus updates the order status in the database
func updateOrderStatus(wg *sync.WaitGroup) {
	defer wg.Done()

	for order := range orderStatusChannel {
		ordersMutex.Lock()
		if existingOrder, ok := orders[order.ID]; ok {
			existingOrder.Status = order.Status
			orders[order.ID] = existingOrder
			log.Printf("Updated order status: %s -> %s", order.ID, order.Status)
		}
		ordersMutex.Unlock()
	}
}

// finalizeOrder finalizes the order process
func finalizeOrder(wg *sync.WaitGroup) {
	defer wg.Done()

	for order := range orderResultChannel {
		ordersMutex.Lock()
		if existingOrder, ok := orders[order.ID]; ok {
			existingOrder.Status = order.Status
			orders[order.ID] = existingOrder
			log.Printf("Finalized order: %s", order.ID)
		}
		ordersMutex.Unlock()
	}
}

// handleNotifications processes system notifications
func handleNotifications(wg *sync.WaitGroup) {
	defer wg.Done()

	for notification := range notificationChannel {
		log.Println("NOTIFICATION:", notification)
	}
}

// getMenuHandler handles request to get the food menu
func getMenuHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	response := Response{
		Success: true,
		Message: "Menu retrieved successfully",
		Data:    foodMenu,
	}

	json.NewEncoder(w).Encode(response)
}

// placeOrderHandler handles request to place a new order
func placeOrderHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var orderData Order
	if err := json.NewDecoder(r.Body).Decode(&orderData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Generate order ID and set initial status
	orderData.ID = generateOrderID()
	orderData.Status = "Received"
	orderData.Timestamp = time.Now().Format(time.RFC3339)

	// Save order
	ordersMutex.Lock()
	orders[orderData.ID] = orderData
	ordersMutex.Unlock()

	// Send to processing
	newOrderChannel <- orderData

	response := Response{
		Success: true,
		Message: "Order placed successfully",
		Data: map[string]string{
			"orderId": orderData.ID,
			"status": orderData.Status,
		},
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// getOrderStatusHandler handles request to get order status
func getOrderStatusHandler(w http.ResponseWriter, r *http.Request) {
	orderID := r.URL.Query().Get("id")
	if orderID == "" {
		http.Error(w, "Order ID is required", http.StatusBadRequest)
		return
	}

	ordersMutex.Lock()
	order, exists := orders[orderID]
	ordersMutex.Unlock()

	if !exists {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	response := Response{
		Success: true,
		Message: "Order status retrieved successfully",
		Data:    order,
	}

	json.NewEncoder(w).Encode(response)
}

// Add these handler functions
func detailsHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "static/details.html")
}

func menuHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "static/menu.html")
}

func finalHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "static/final.html")
}

func main() {
	// Create a wait group to manage goroutines
	var wg sync.WaitGroup

	// Start the worker goroutines
	wg.Add(4)
	go processOrder(&wg)
	go updateOrderStatus(&wg)
	go finalizeOrder(&wg)
	go handleNotifications(&wg)

	// Serve static files
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Set up API routes
	http.HandleFunc("/api/menu", getMenuHandler)
	http.HandleFunc("/api/order", placeOrderHandler)
	http.HandleFunc("/api/order/status", getOrderStatusHandler)
	
	// Serve index.html for the root path
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "static/index.html")
			return
		}
		http.NotFound(w, r)
	})

	// Add new route handlers
	http.HandleFunc("/details", detailsHandler)
	http.HandleFunc("/menu", menuHandler)
	http.HandleFunc("/final", finalHandler)

	// Start the server
	fmt.Println("Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
