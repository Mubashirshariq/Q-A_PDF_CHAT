# Q&A with multiple pdfs

This repository contains a web application for querying multiple pdfs. The frontend is built with React, and the backend is powered by FastAPI. 


## Tech Stack

- **Frontend**: React
- **Backend**: FastAPI
- **LLM**: llama3(Ollama)

## Setup Instructions

### Prerequisites

- [Python 3.10+](https://www.python.org/)
- [venv](https://docs.python.org/3/library/venv.html) (for creating virtual environments)

### Frontend Setup

1. Clone the repository:
    ```sh
    git clone https://github.com/Mubashirshariq/Q-A_PDF_CHAT.git
    ```

2. Navigate to the `frontend` directory:
    ```sh
    cd frontend
    ```

3. Install the dependencies:
    ```sh
    npm install
    ```

4. Start the frontend development server:
    ```sh
    npm run dev
    ```

### Backend Setup
Now create one more terminal to run the backend
1. Navigate to the `backend` directory:
    ```sh
    cd backend
    ```

2. Create a virtual environment:
    ```sh
    python -m venv myenv
    ```

4. Activate the virtual environment:
    - On Windows:
        ```sh
        myenv\Scripts\activate
        ```
    - On macOS and Linux:
        ```sh
        source myenv/bin/activate
        ```

5. Install the dependencies:
    ```sh
    pip install -r requirements.txt
    ```

6. Run the FastAPI server:
    ```sh
    uvicorn main:app --reload
    ```

## Usage

Once both the frontend and backend servers are running, you can access the application by navigating to `http://localhost:5173` in your web browser.
