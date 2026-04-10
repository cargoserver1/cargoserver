FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

EXPOSE 10000

CMD ["java", "-jar", "target/logistics-backend-0.0.2-SNAPSHOT.jar"]