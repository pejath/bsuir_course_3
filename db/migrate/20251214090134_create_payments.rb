class CreatePayments < ActiveRecord::Migration[8.1]
  def change
    create_table :payments do |t|
      t.references :booking, null: false, foreign_key: true
      t.decimal :amount
      t.integer :payment_method
      t.integer :status
      t.datetime :payment_date
      t.string :transaction_id
      t.text :notes

      t.timestamps
    end
  end
end
