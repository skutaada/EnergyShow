# EnergyShow

EnergyShow is a backend service designed to track, store, and serve energy market prices. It fetches real-time pricing data from the SmartEnergy API, stores it locally for historical access, and provides a RESTful API for frontend applications.

## Features

-   **Smart Price Fetching**: Automatically retrieves electricity prices from the external SmartEnergy API (`apis.smartenergy.at`).
-   **Local Caching**: Stores price data in a SQLite database (`energyshow.db`) to minimize external API calls and enable historical lookup.
-   **REST API**: Exposes clean endpoints for current prices, historical ranges, and data availability.
-   **Container Ready**: Fully configured with Docker and Docker Compose for instant deployment.

## Frontend

The project includes a lightweight, responsive frontend dashboard served at the root URL (`/`).

-   **Interactive Charts**: Visualizes price trends using Chart.js with zoom and pan capabilities.
-   **Statistics**: Instantly sees Minimum, Maximum, and Average prices for the selected day.
-   **Historical Data**: Browse past prices using the built-in date picker.
-   **Visual Indicators**: Color-coded gradients to easily spot high and low price periods.

## Tech Stack

-   **Language**: Python 3.14
-   **Web Framework**: FastAPI
-   **ORM**: SQLAlchemy
-   **Database**: SQLite
-   **Package Manager**: uv
-   **Infrastructure**: Docker

## API Endpoints

-   `GET /api/prices/today`: Fetches the latest prices from the provider, saves them to the DB, and returns them.
-   `GET /api/prices`: Retrieves stored prices for a specific date range.
    -   Parameters: `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD)
-   `GET /api/prices/dates`: Returns a list of all dates for which price data is available.

## Getting Started

### Running with Docker (Recommended)

The easiest way to run the project is using Docker Compose.

1.  **Build and Start**:
    ```bash
    docker compose up -d --build
    ```

2.  **Access the Application**:
    -   API Root: `http://localhost:8000`
    -   Interactive Docs: `http://localhost:8000/docs`

### Running Locally

If you prefer to run the Python application directly:

**Prerequisites:**
-   Python 3.14+
-   `uv` package manager (recommended)

1.  **Install Dependencies**:
    ```bash
    uv sync
    ```
    *Alternatively, you can use pip: `pip install .`*

2.  **Run the Server**:
    ```bash
    fastapi dev src/energyshow/main.py
    ```

3.  **Access the Application**:
    The server will start at `http://localhost:8000`.
