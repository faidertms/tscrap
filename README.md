# TWebScrap
### :construction::construction_worker: Under Construction :exclamation:  

A little project to find product price and store in database, making a price log of the product. Like 'Zoom' site.
If product price is lower, a message will be sent with new price and url via telegram.

This project is not being done as a final product, **it has been made only for academic purposes in order to discover how the tool works**, so it should not be used in production and **I am not responsible for any other problem that may occur**.   


## This project use :sparkles: 
:heavy_check_mark: Javascript(ES6+)   
:heavy_check_mark: Playwright    
:heavy_check_mark: Postgres(node-pg)  
:heavy_check_mark: Cronjob  

## Things to be made :clipboard:  

- [] Product, Store Table. 
- [] Product, Store and CRUD page using react and expressjs.  

## Run Project

**Before run make a new .env based in example.env**

>CHAT_ID= YOUR CHAT ID IN TELEGRAM  
>API_TOKEN= YOUR API_TOKEN IN TELEGRAM  
>DB_HOST= YOUR POSTGRES HOST  
>DB_USER= YOUR POSTGRES USER  
>DB_PASS= YOUR POSTGRES PASSWORD  
>DB_DATABASE= YOUR POSTGRES DATABASE  
>DB_PORT= YOUR POSTGRES PORT  
>DB_SSL=true  

**Script to create a new database is in db/database.sql**

```sh
 npm install
 npm start
```

## Images :framed_picture:

Telegram Chat :mailbox::calling:: 

![](https://raw.githubusercontent.com/faidertms/tscrap/main/telegram.png)
