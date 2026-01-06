class Api::V1::BookingsController < Api::V1::BaseController
  before_action :set_booking, only: [ :update, :destroy, :cancel ]
  before_action :set_booking_with_details, only: [ :show ]

  def index
    authorize Booking
    bookings = Booking.includes(:guest, :user, :services, :booking_services, room: :room_type)

    bookings = bookings.where(status: params[:status]) if params[:status].present?
    bookings = bookings.where(room_id: params[:room_id]) if params[:room_id].present?
    bookings = bookings.where(guest_id: params[:guest_id]) if params[:guest_id].present?

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

    bookings = bookings.order(check_in_date: :desc)
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
      render json: @booking, include: { booking_services: { include: :service } }, status: :created
    else
      render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @booking

    if @booking.update(booking_params)
      render json: @booking, include: { booking_services: { include: :service } }
    else
      render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @booking
    @booking.destroy
    head :no_content
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
