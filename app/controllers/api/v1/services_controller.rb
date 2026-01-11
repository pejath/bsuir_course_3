class Api::V1::ServicesController < Api::V1::BaseController
  before_action :set_service, only: [ :show, :update, :destroy ]

  def index
    @services = Service.all
    authorize @services
    render json: @services
  end

  def show
    authorize @service
    render json: @service
  end

  def create
    @service = Service.new(service_params)
    authorize @service

    if @service.save
      render json: { 
        success: true,
        message: I18n.t('services.create.success'),
        data: @service
      }, status: :created
    else
      translated_errors = @service.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.service.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.service.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      render json: { 
        success: false,
        message: I18n.t('services.create.failed'),
        errors: translated_errors
      }, status: :unprocessable_entity
    end
  end

  def update
    authorize @service

    if @service.update(service_params)
      render json: { 
        success: true,
        message: I18n.t('services.update.success'),
        data: @service
      }
    else
      translated_errors = @service.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.service.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.service.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      render json: { 
        success: false,
        message: I18n.t('services.update.failed'),
        errors: translated_errors
      }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @service
    if @service.destroy
      render json: { 
        success: true,
        message: I18n.t('services.destroy.success'),
        service_id: @service.id,
        service_name: @service.name
      }
    else
      # Translate each error properly
      translated_errors = @service.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.service.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.service.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      render json: { 
        success: false,
        message: I18n.t('services.destroy.failed'),
        errors: translated_errors
      }, status: :unprocessable_entity
    end
  end

  private

  def set_service
    @service = Service.find(params[:id])
  end

  def service_params
    params.require(:service).permit(:name, :description, :price, :active)
  end
end
