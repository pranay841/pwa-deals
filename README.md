# magento-pwa

Steps to install:

1.  Create folder @hbwsl in root of venia theme.
2.  Store deals folder(repository) in @hbwsl
3.  In venia package.json, under dependecies add following line
    "@hbwsl/deals": "link:./@hbwsl/deals"
4.  yarn install (which will install extension in node_modules)
4.  yarn watch
# pwa-deals
