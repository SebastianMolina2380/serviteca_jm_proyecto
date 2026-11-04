# ============================================================
# SERVITECA JM — IMAGEN DEL BACKEND SPRING BOOT
# ============================================================
# Build multietapa:
#   1. build: compila con Maven + JDK 17 y genera el JAR ejecutable.
#   2. runtime: imagen JRE 17 mínima, usuario sin privilegios.
#
# Construcción (desde la raíz del repositorio):
#   docker build -t serviteca-jm ./serviteca-jm_v5.0
#
# La aplicación escucha en el puerto que indique PORT (8082 por
# defecto). Render y otros PaaS definen PORT automáticamente.
# ============================================================

# ── ETAPA 1: COMPILACIÓN ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build

# Copiar primero el POM para aprovechar la caché de dependencias.
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp clean package -DskipTests

# ── ETAPA 2: EJECUCIÓN ──────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

# Utilidades mínimas para el healthcheck y usuario sin privilegios.
RUN addgroup -S serviteca && adduser -S serviteca -G serviteca

WORKDIR /app

COPY --from=build /build/target/*.jar /app/app.jar
RUN chown -R serviteca:serviteca /app

USER serviteca

# Solo informativo: el puerto real lo decide la variable PORT.
EXPOSE 8082

# Ajustes de JVM conservadores para contenedores pequeños; se pueden
# sobrescribir definiendo JAVA_OPTS en docker-compose o en el orquestador.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -Djava.awt.headless=true -Duser.timezone=America/Bogota"

# El endpoint de salud es público y no expone detalles en prod.
# Se interpola PORT para que el healthcheck siga al puerto real.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT:-8082}/actuator/health" >/dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
