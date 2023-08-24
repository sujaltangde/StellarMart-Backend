const Order = require('../models/orderModel.js')
const Product = require('../models/productModel.js')

// Create New Order
exports.newOrder = async (req, res) => {
    try {
        const {
            shippingInfo,
            orderItems,
            paymentInfo,
            itemPrice,
            taxPrice,
            shippingPrice,
            totalPrice
        } = req.body;

        const order = await Order.create({
            shippingInfo,
            orderItems,
            paymentInfo,
            taxPrice,
            itemPrice,
            shippingPrice,
            totalPrice,
            paidAt: Date.now(),
            user: req.user._id
        });


        res.status(201).json({
            success: true,
            message: "Order Created Successfully",
            order
        })

    } catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        })
    }
}


// Get Single Order
exports.getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email");

        if (!order) {
            return res.status(400).json({
                success: false,
                message: "Order not found with this ID",
            })
        }

        res.status(200).json({
            success: true,
            order
        })

    } catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        })
    }
}



// Get Logged In User Orders
exports.myOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }) ;


        res.status(200).json({
            success: true,
            orders,
            totalOrders: orders.length
        })

    } catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        })
    }
}



// Get All Orders -- Admin
exports.getAllOrders = async (req, res) => {
    try{
        const orders = await Order.find() ;

        let totalAmount = 0 ;

        orders.forEach((order) =>  
        {
            totalAmount += order.totalPrice
        })


        res.status(200).json({
            success: true,
            orders,
            totalAmount,
            totalOrders:orders.length
        })

    }catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        })
    }
}


// Update Orders -- Admin
exports.updateOrder = async (req, res) => {
    try{
        const order = await Order.findById(req.params.id) ;
        
        if(!order){
            return res.status(404).json({
                success: false,
                message: "Order not found with this ID"
            })
        }

        if(order.orderStatus === "Delivered"){
            return res.status(404).json({
                success: true,
                message: "You have already delivered this order"
            })
        }

        if(req.body.status === "Shipped"){
            order.orderItems.forEach(async (o)=>{
                await updateStock(o.product, o.quantity)
            })
        }

        order.orderStatus = req.body.status ;

        if(req.body.status === "Delivered"){
            order.deliveredAt = Date.now()
        }

        await order.save({
            validateBeforeSave: false
        })

        res.status(200).json({
            success: true,
            messgae:"Order Updated"
            
        })

    }catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        })
    }
}



// Delet Order -- Admin
exports.deleteOrder = async (req, res) => {
    try{
        let order = await Order.findById(req.params.id) ;

        if(!order){
            return res.status(404).json({
                success: false,
                message: "Order not found with this ID"
            })
        }

        order = await Order.findByIdAndRemove(req.params.id) ;


        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
            deletedOrder: order
            
        })

    }catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        })
    }
}



async function updateStock(id, quantity){
    const product = await Product.findById(id) ;

    product.stock -= quantity ;

    await product.save({ validateBeforeSave: false }) ;

}