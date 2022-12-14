const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const {Product} = require('../models/product');
const multer = require('multer');


const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');

        if(isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype]
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage})


router.get(`/`, async(req, res) => {
    let filter = {}
    if(req.query.categories){
        filter = {category: req.query.categories.split('.')}
    }
    const productList = await Product.find()
    // const productList = await Product.find().select('name');
    if(!productList) {
         res.status(500).json({success: false})
    }
    res.send(productList)
 })

 router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category')

    if(!product){
        return res.status(500).json({success: false})
    }
    res.send(product);
 })
 
 router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
        if(!category) 
        return res.status(400).send('Invalid Category')

        const file = req.file;
        if(!file) return res.status(400).send('No image in the request')

        const fileName = req.file.filename
        const basePath = `${req.protocol}://${req.get('host')}/public/upload`

     const product = new Product({
         name: req.body.name,
         description: req.body.description,
         richDescription: req.body.richDescription,
         image: `${basePath}${fileName}`,
         brand: req.body.brand,
         price: req.body.price,
         category: req.body.category,
         countInStock: req.body.countInStock,
         rating: req.body.rating,
         numReviews: req.body.numReviews,
         isFeatured: req.body.isFeatured,
     })

    let savedProduct = await product.save()
    if(!savedProduct)
        return res.status(500).send('The product cannot be created')
     
    res.send(savedProduct)
 })

 router.put('/:id', async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product Id')
    }
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category')


    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true}
    )
    if(!product)
    return res.status(500).send('The product cannot be updated!')

    res.send(product)
 })

 router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if (!product) {
            return res.status(200).json({
                success: true,
                message: 'The product has been deleted'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: 'Product not found!'
            })
        }
    }).catch(err => {
        return res.status(500).json({
            success: false,
            error: err
        })
    })
 })

 router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments()

    if(!productCount) {
        res.status(500).json({success: false})
    }
    res.send({
         productCount: productCount
    })
 })

 router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const productFeatured = await Product.find({
        isFeatured: true
    }).limit(count)

    if(!productFeatured) {
        res.status(500).json({success: false})
    }
    res.send(productFeatured)
 })

 router.put('/gallery-images/:id',uploadOptions.array('images', 10),async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).send('Invalid Product Id')
        }
        const files = res.files
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/upload`
        if(files) {
            files.map(file => {
                imagesPaths.push(`${basePath}${file.fileName}`);
            })
        }
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            { new: true }
        )
        if(!product)
            return res.status(500).send('The product cannot be updated')
        res.send(product);
    }
 )

 module.exports = router;