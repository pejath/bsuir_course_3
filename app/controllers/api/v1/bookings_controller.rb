class Api::V1::BookingsController < Api::V1::BaseController
  before_action :set_booking, only: [ :update, :destroy, :cancel ]
  before_action :set_booking_with_details, only: [ :show ]

  def index
    authorize Booking
    bookings = Booking.includes(:guest, :user, :services, :booking_services, room: :room_type)

    bookings = bookings.where(status: params[:status]) if params[:status].present?
    bookings = bookings.where(room_id: params[:room_id]) if params[:room_id].present?
    bookings = bookings.where(guest_id: params[:guest_id]) if params[:guest_id].present?

    if params[:room_number].present?
      bookings = bookings.joins(:room).where("rooms.number ILIKE ?", "%#{params[:room_number]}%")
    end

    if params[:guest_name].present?
      bookings = bookings.joins(:guest).where(
        "guests.first_name ILIKE ? OR guests.last_name ILIKE ? OR CONCAT(guests.first_name, ' ', guests.last_name) ILIKE ?",
        "%#{params[:guest_name]}%",
        "%#{params[:guest_name]}%",
        "%#{params[:guest_name]}%"
      )
    end

    bookings = bookings.where("check_in_date >= ?", params[:check_in_from]) if params[:check_in_from].present?
    bookings = bookings.where("check_in_date <= ?", params[:check_in_to]) if params[:check_in_to].present?
    bookings = bookings.where("check_out_date >= ?", params[:check_out_from]) if params[:check_out_from].present?
    bookings = bookings.where("check_out_date <= ?", params[:check_out_to]) if params[:check_out_to].present?

    # Sort: pending bookings first (by check_in_date asc), then others by check_in_date desc
    bookings = bookings.order(
      Arel.sql("CASE WHEN bookings.status = 0 THEN 0 ELSE 1 END"),
      Arel.sql("CASE WHEN bookings.status = 0 THEN bookings.check_in_date ELSE NULL END ASC"),
      Arel.sql("CASE WHEN bookings.status != 0 THEN bookings.check_in_date ELSE NULL END DESC")
    )
    pagy, @bookings = pagy(bookings, limit: params[:limit] || 50)
    render json: {
      data: @bookings.as_json(include: {
        room: { include: :room_type },
        guest: {},
        user: {},
        booking_services: { include: :service }
      }),
      pagination: pagy_metadata(pagy)
    }
  end

  def show
    authorize @booking
    render json: @booking, include: { room: { include: :room_type }, guest: {}, user: {}, booking_services: { include: :service }, payments: {} }
  end

  def create
    @booking = Booking.new(booking_params)
    @booking.user = current_user
    authorize @booking

    if @booking.save
      render json: { 
        success: true,
        message: I18n.t('bookings.create.success'),
        data: @booking
      }, status: :created
    else
      translated_errors = @booking.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.booking.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.booking.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      # Also return field errors for highlighting
      field_errors = @booking.errors.messages.transform_values do |messages|
        messages.map { |msg| I18n.t("activerecord.errors.models.booking.attributes.#{msg.downcase.gsub(' ', '_')}", default: msg) }
      end
      
      render json: { 
        success: false,
        message: I18n.t('bookings.create.failed'),
        errors: translated_errors,
        field_errors: field_errors
      }, status: :unprocessable_entity
    end
  end

  def update
    authorize @booking

    if @booking.update(booking_params)
      render json: { 
        success: true,
        message: I18n.t('bookings.update.success'),
        data: @booking
      }
    else
      translated_errors = @booking.errors.messages.map do |field, messages|
        messages.map do |msg|
          # Try to translate the error message
          error_key = msg.downcase.gsub(' ', '_')
          translated_msg = I18n.t("activerecord.errors.models.booking.attributes.#{field}.#{error_key}", default: msg)
          
          # If translation not found, try general messages
          if translated_msg == msg
            translated_msg = I18n.t("activerecord.errors.messages.#{error_key}", default: msg)
          end
          
          # For base errors, try base translations
          if translated_msg == msg && field == :base
            translated_msg = I18n.t("activerecord.errors.models.booking.base.#{error_key}", default: msg)
          end
          
          translated_msg
        end
      end.flatten
      
      # Also return field errors for highlighting
      field_errors = @booking.errors.messages.transform_values do |messages|
        messages.map { |msg| I18n.t("activerecord.errors.models.booking.attributes.#{msg.downcase.gsub(' ', '_')}", default: msg) }
      end
      
      render json: { 
        success: false,
        message: I18n.t('bookings.update.failed'),
        errors: translated_errors,
        field_errors: field_errors
      }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @booking
    if @booking.destroy
      render json: { 
        message: 'Booking deleted successfully',
        booking_id: @booking.id,
        room_number: @booking.room&.number
      }
    else
      render json: { 
        errors: @booking.errors.full_messages,
        message: 'Failed to delete booking'
      }, status: :unprocessable_entity
    end
  end

  def cancel
    authorize @booking, :cancel?

    if @booking.update(status: :cancelled)
      render json: @booking
    else
      render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_booking
    @booking = Booking.find(params[:id])
  end

  def set_booking_with_details
    @booking = Booking.includes(:guest, :user, :services, :payments, booking_services: :service, room: :room_type).find(params[:id])
  end

  def booking_params
    params.require(:booking).permit(
      :room_id, :guest_id, :check_in_date, :check_out_date,
      :number_of_guests, :total_price, :status, :notes,
      booking_services_attributes: [ :id, :service_id, :quantity, :price, :_destroy ]
    )
  end
end
