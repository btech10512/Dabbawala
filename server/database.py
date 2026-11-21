# engine selection and creation -> 3 steps need to be followed

from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///dabbawala.db"

engine = create_engine(DATABASE_URL, echo=True)

def create_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    """ provides a new database connection """
    with Session(engine) as session:
        yield session
