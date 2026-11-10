FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-ipafont-gothic \
    && apt-get clean
RUN pip install --no-cache-dir --only-binary=:all: pyopenjtalk-plus pillow numpy
WORKDIR /app
COPY video/make_video.py video/make_video.py
CMD ["python3", "video/make_video.py"]
