#!/bin/bash

# =====================================================
# CAREFLOW AI - PRODUCTION DEPLOYMENT SCRIPT
# =====================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install npm"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    if [[ $(echo "$node_version" | cut -d'.' -f1) -lt 18 ]]; then
        log_error "Node.js version $node_version is too old. Requires 18+"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    if [ ! -f ".env.local" ]; then
        log_warning ".env.local not found. Creating from template..."
        cp .env.example .env.local
        log_error "Please configure .env.local with your environment variables"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source .env.local
    set +a
    
    # Validate required variables
    local required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_GEMINI_API_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"your_"* ]]; then
            log_error "Required environment variable $var is not configured"
            exit 1
        fi
    done
    
    log_success "Environment setup complete"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm ci --production=false
    else
        log_info "Dependencies already installed, skipping..."
    fi
    
    log_success "Dependencies installation complete"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    if npm run test -- --run; then
        log_success "All tests passed"
    else
        log_error "Tests failed. Please fix test failures before deployment."
        exit 1
    fi
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Set production mode
    export NODE_ENV=production
    
    # Build with error tolerance (allow warnings but not errors)
    if npm run build; then
        log_success "Build completed successfully"
    else
        log_error "Build failed. Please fix build errors."
        exit 1
    fi
}

# Optimize build artifacts
optimize_build() {
    log_info "Optimizing build artifacts..."
    
    # Compress static assets
    if command -v gzip &> /dev/null; then
        log_info "Compressing assets with gzip..."
        find dist -name "*.js" -o -name "*.css" | xargs -I {} gzip -k {}
        log_success "Asset compression complete"
    fi
    
    # Generate build report
    if [ -d "dist" ]; then
        local total_size=$(du -sh dist | cut -f1)
        local js_size=$(find dist -name "*.js" -exec du -ch {} + | awk '{sum += $1} END {print sum}')
        local css_size=$(find dist -name "*.css" -exec du -ch {} + | awk '{sum += $1} END {print sum}')
        
        log_info "Build Report:"
        log_info "  Total size: ${total_size}"
        log_info "  JS size: ${js_size}"
        log_info "  CSS size: ${css_size}"
    fi
}

# Security checks
security_checks() {
    log_info "Running security checks..."
    
    # Check for exposed secrets
    if grep -r "VITE_.*_KEY.*[^eE]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" src/ 2>/dev/null; then
        log_warning "Potential exposed keys found in source code"
        log_warning "Please ensure all secrets are in environment variables only"
    fi
    
    # Check dependencies for vulnerabilities
    log_info "Checking for known vulnerabilities..."
    npm audit --audit-level moderate
    
    log_success "Security checks complete"
}

# Create deployment package
create_deployment_package() {
    log_info "Creating deployment package..."
    
    local package_name="careflow-ai-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    tar -czf "$package_name" dist/
    
    log_success "Deployment package created: $package_name"
    
    # Generate checksum
    if command -v sha256sum &> /dev/null; then
        sha256sum "$package_name" > "$package_name.sha256"
        log_info "Checksum: $(cat "$package_name.sha256")"
    fi
}

# Main deployment function
deploy_to_staging() {
    log_info "Preparing for staging deployment..."
    
    if command -v netlify &> /dev/null; then
        log_info "Deploying to Netlify staging..."
        netlify deploy --dir=dist --message="CareFlow AI Production Build $(date)" --site=careflow-ai-staging
        log_success "Staging deployment complete"
    else
        log_info "Netlify CLI not found. Manual deployment required."
        log_info "Upload contents of 'dist/' directory to your hosting provider."
    fi
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check if build artifacts exist
    if [ ! -f "dist/index.html" ]; then
        log_error "Build artifacts missing"
        return 1
    fi
    
    # Check critical files
    local critical_files=("dist/index.html" "dist/assets/main-*.js" "dist/assets/main-*.css")
    for file in "${critical_files[@]}"; do
        if ! ls $file 2>/dev/null; then
            log_warning "Critical file missing: $file"
        fi
    done
    
    log_success "Health checks complete"
}

# Cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f *.tar.gz *.sha256
    log_success "Cleanup complete"
}

# Show help
show_help() {
    echo "CareFlow AI Production Deployment Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -t, --test    Run tests only"
    echo "  -b, --build   Build only (skip tests)"
    echo "  -s, --stage   Deploy to staging"
    echo "  -c, --check   Run security and health checks only"
    echo "  -h, --help    Show this help message"
    echo
    echo "Full Deployment (Recommended):"
    echo "  $0                # Complete deployment pipeline"
    echo
    echo "Environment Variables Required in .env.local:"
    echo "  VITE_SUPABASE_URL=your_supabase_url"
    echo "  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "  VITE_GEMINI_API_KEY=your_gemini_api_key"
}

# Parse arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -t|--test)
        check_prerequisites
        setup_environment
        install_dependencies
        run_tests
        ;;
    -b|--build)
        check_prerequisites
        setup_environment
        install_dependencies
        build_application
        optimize_build
        health_check
        ;;
    -s|--stage)
        check_prerequisites
        setup_environment
        install_dependencies
        run_tests
        build_application
        optimize_build
        security_checks
        create_deployment_package
        deploy_to_staging
        ;;
    -c|--check)
        security_checks
        health_check
        ;;
    "")
        # Default: Full deployment
        log_info "🚀 Starting CareFlow AI Production Deployment"
        echo "=================================="
        
        check_prerequisites
        setup_environment
        install_dependencies
        run_tests
        build_application
        optimize_build
        security_checks
        create_deployment_package
        health_check
        
        echo "=================================="
        log_success "🎉 CareFlow AI is ready for production deployment!"
        log_info "Deployment package created and health checks passed."
        log_info "Next steps:"
        echo "  1. Review build artifacts in dist/"
        echo "  2. Upload to your hosting provider"
        echo "  3. Configure custom domain and SSL"
        echo "  4. Set up monitoring and analytics"
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac