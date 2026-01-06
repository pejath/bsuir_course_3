class Api::V1::PaymentsController < Api::V1::BaseController
  before_action :set_payment, only: [ :show, :update, :destroy ]

  def index
    @payments = Payment.includes(:booking).all
    authorize @payments
    render json: @payments, include: :booking
  end

  def show
    authorize @payment
    render json: @payment, include: :booking
  end

  def create
    @payment = Payment.new(payment_params)
    authorize @payment

    if @payment.save
      render json: @payment, status: :created
    else
      render json: { errors: @payment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @payment

    if @payment.update(payment_params)
      render json: @payment
    else
      render json: { errors: @payment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @payment
    @payment.destroy
    head :no_content
  end

  private

  def set_payment
    @payment = Payment.find(params[:id])
  end

  def payment_params
    params.require(:payment).permit(:booking_id, :amount, :payment_method, :status, :payment_date, :transaction_id, :notes)
  end
end
