const router = require('express').Router();
const algoliasearch = require('algoliasearch');
const client = algoliasearch('UPKS0MQV50','3f544c020ff485c60edcb98eb6e73995');
const index = client.initIndex('amazonov1');


router.get('/',(req,res,next) => {
    if (req.query.query) {
        index.search({
            query: req.query.query,
            page: req.query.page,
        },(err, content) => {
            res.json({
                success: true,
                message: "Here is your search",
                status: 200,
                content: content,
                search_result: req.query.query
            });
        });
    }
});

module.exports = router;