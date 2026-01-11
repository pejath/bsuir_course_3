class Api::V1::GuestsController < Api::V1::BaseController
  before_action :set_guest, only: [ :show, :update, :destroy ]

  def index
    authorize Guest
    guests = Guest.all

    if params[:search].present?
      search_term = "%#{params[:search]}%"
      guests = guests.where(
        "first_name ILIKE ? OR last_name ILIKE ? OR CONCAT(first_name, ' ', last_name) ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR passport_number ILIKE ?",
        search_term, search_term, search_term, search_term, search_term, search_term
      )
    end

    guests = guests.where(country: params[:country]) if params[:country].present?

    guests = guests.order(created_at: :desc)
    pagy, @guests = pagy(guests, limit: params[:limit] || 50)
    render json: {
      data: @guests,
      pagination: pagy_metadata(pagy)
    }
  end

  def show
    authorize @guest
    render json: @guest
  end

  def create
    @guest = Guest.new(guest_params)
    authorize @guest

    if @guest.save
      render json: { 
        success: true,
        message: I18n.t('guests.create.success'),
        data: @guest
      }, status: :created
    else
      translated_errors = @guest.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.guest.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.guest.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      render json: { 
        success: false,
        message: I18n.t('guests.create.failed'),
        errors: translated_errors
      }, status: :unprocessable_entity
    end
  end

  def update
    authorize @guest

    if @guest.update(guest_params)
      render json: { 
        success: true,
        message: I18n.t('guests.update.success'),
        data: @guest
      }
    else
      translated_errors = @guest.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.guest.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.guest.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      render json: { 
        success: false,
        message: I18n.t('guests.update.failed'),
        errors: translated_errors
      }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @guest

    if @guest.destroy
      render json: { 
        success: true,
        message: I18n.t('guests.destroy.success'),
        guest_id: @guest.id,
        guest_name: "#{@guest.first_name} #{@guest.last_name}"
      }
    else
      # Translate each error properly
      translated_errors = @guest.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.guest.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.guest.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      render json: { 
        success: false,
        message: I18n.t('guests.destroy.failed'),
        errors: translated_errors
      }, status: :unprocessable_entity
    end
  end

  private

  def set_guest
    @guest = Guest.find(params[:id])
  end

  def guest_params
    params.require(:guest).permit(:first_name, :last_name, :email, :phone, :passport_number, :date_of_birth, :country, :notes)
  end
end
