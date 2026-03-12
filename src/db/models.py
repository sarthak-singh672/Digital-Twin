from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date,
    ForeignKey, UniqueConstraint, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    hashed_password = Column(String, nullable=False)
    dob = Column(Date, nullable=True)
    consent = Column(Boolean, default=False, nullable=True)
    # ✅ NEW: Avatar stored as base64 data URI
    avatar = Column(Text, nullable=True)
    theme = Column(String(50), default='ocean', nullable=True)

    vitals = relationship("Vitals", back_populates="user")
    lifestyles = relationship("Lifestyle", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    academics = relationship("Academic", back_populates="user")
    predictions = relationship("Prediction", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")
    goals = relationship("Goal", back_populates="user")


class Vitals(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    hr = Column(Integer)
    bp_sys = Column(Integer)
    bp_dia = Column(Integer)
    spo2 = Column(Integer)
    temp = Column(Float)

    user = relationship("User", back_populates="vitals")


class Lifestyle(Base):
    __tablename__ = "lifestyle"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    date = Column(Date, nullable=False)
    sleep_hrs = Column(Float)
    water_glasses = Column(Integer)
    diet_score = Column(Integer)
    stress_score = Column(Integer)

    user = relationship("User", back_populates="lifestyles")
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_date_lifestyle_uc'),)


class Activity(Base):
    __tablename__ = "activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    date = Column(Date, nullable=False)
    steps = Column(Integer)
    exercise_mins = Column(Integer)

    user = relationship("User", back_populates="activities")
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_date_activity_uc'),)


class Academic(Base):
    __tablename__ = "academic"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    date = Column(Date, nullable=False)
    study_hrs = Column(Float)
    attendance_pct = Column(Float)
    assignments_on_time = Column(Integer)

    user = relationship("User", back_populates="academics")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    model = Column(String(100), nullable=False)
    pred_ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    risk_score = Column(Float, nullable=False)
    label = Column(String(50))

    user = relationship("User", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    alert_ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    alert_type = Column(String(100), nullable=False)
    resolved_flag = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="alerts")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(String(50))
    title = Column(String(200))
    explanation = Column(String(1000))
    causes = Column(String(1000))
    goals = Column(String(1000))

    user = relationship("User", back_populates="recommendations")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    date = Column(Date, nullable=False)
    text = Column(String(500), nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="goals")