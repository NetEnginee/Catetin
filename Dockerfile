# Base image: PHP 8.4 FPM
FROM php:8.4-fpm AS base

# Set container timezone
ENV TZ=Asia/Jakarta

# Install required system packages and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && docker-php-ext-install pdo_mysql opcache \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /var/www/html

# Development stage
FROM base AS development

# Use PHP development configuration
RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini" \
    && { \
        echo "date.timezone = Asia/Jakarta"; \
        echo "display_errors = On"; \
        echo "display_startup_errors = On"; \
        echo "error_reporting = E_ALL"; \
    } > "$PHP_INI_DIR/conf.d/docker-php-custom.ini"

# Set ownership to standard web user
RUN chown -R www-data:www-data /var/www/html

CMD ["php-fpm"]

# Production stage
FROM base AS production

# Use PHP production configuration
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && { \
        echo "date.timezone = Asia/Jakarta"; \
        echo "expose_php = Off"; \
        echo "display_errors = Off"; \
        echo "display_startup_errors = Off"; \
        echo "error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT"; \
    } > "$PHP_INI_DIR/conf.d/docker-php-custom.ini"

# Copy application source code into the image for production
COPY --chown=www-data:www-data . /var/www/html

CMD ["php-fpm"]
