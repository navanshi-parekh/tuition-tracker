from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Tell Python where to find or create the database file
DATABASE_URL = "sqlite:///./tuition_data.db"

# 2. Create the engine wrapper to handle database communication
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Needed only for SQLite stability
)

# 3. Create a session factory (this generates unique database connections for actions)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. The base class that our database tables will inherit from later
Base = declarative_base()

# A helper tool to open and safely close the database when an API request happens
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()