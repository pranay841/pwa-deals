#!/bin/bash
# https://magento.github.io/pwa-studio/venia-pwa-concept/setup/
url=$(gp url | awk -F"//" {'print $2'}) && url+="/" && url="https://8002-"$url;
export MAGENTO_BACKEND_URL="${MAGENTO_BACKEND_URL:-${url}}"
export CHECKOUT_BRAINTREE_TOKEN="${CHECKOUT_BRAINTREE_TOKEN:-sandbox_8yrzsvtm_s2bg8fs563crhqzk}"

rm -rf /workspace/magento2gitpod/node_modules
rm -rf /workspace/magento2gitpod/.npm
rm -rf /workspace/magento2gitpod/pwa

export NVM_DIR=/workspace/magento2gitpod/pwa/nvm
mkdir -p $NVM_DIR
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
npm install yarn -g
npm install rimraf -g

cd /workspace/pwa-deals
#!/bin/bash
# https://magento.github.io/pwa-studio/venia-pwa-concept/setup/
url=$(gp url | awk -F"//" {'print $2'}) && url+="/" && url="https://8002-"$url;
export MAGENTO_BACKEND_URL="${MAGENTO_BACKEND_URL:-${url}}"
export CHECKOUT_BRAINTREE_TOKEN="${CHECKOUT_BRAINTREE_TOKEN:-sandbox_8yrzsvtm_s2bg8fs563crhqzk}"

rm -rf /workspace/magento2gitpod/node_modules
rm -rf /workspace/magento2gitpod/.npm
rm -rf /workspace/magento2gitpod/pwa

export NVM_DIR=/workspace/magento2gitpod/pwa/nvm
mkdir -p $NVM_DIR
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
npm install yarn -g
npm install rimraf -g

cd /workspace/pwa-deals
