class ChangeGuestIdToNullableInBookings < ActiveRecord::Migration[8.1]
  def change
    change_column_null :bookings, :guest_id, true
  end
end
